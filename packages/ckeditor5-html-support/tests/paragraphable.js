/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

import ClassicTestEditor from '@ckeditor/ckeditor5-core/tests/_utils/classictesteditor';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import Bold from '@ckeditor/ckeditor5-basic-styles/src/bold';
import Italic from '@ckeditor/ckeditor5-basic-styles/src/italic';
import ShiftEnter from '@ckeditor/ckeditor5-enter/src/shiftenter';
import GeneralHtmlSupport from '../src/generalhtmlsupport';
import { getModelDataWithAttributes } from './_utils/utils';
import { getData as getModelData } from '@ckeditor/ckeditor5-engine/src/dev-utils/model';

/* global document */

describe( 'ParagraphableHtmlSupport', () => {
	let editor, model, editorElement, dataFilter, dataSchema;

	beforeEach( () => {
		editorElement = document.createElement( 'div' );
		document.body.appendChild( editorElement );

		return ClassicTestEditor
			.create( editorElement, {
				plugins: [ Paragraph, Bold, Italic, ShiftEnter, GeneralHtmlSupport ]
			} )
			.then( newEditor => {
				editor = newEditor;
				model = editor.model;

				dataFilter = editor.plugins.get( 'DataFilter' );
				dataSchema = editor.plugins.get( 'DataSchema' );
			} );
	} );

	afterEach( () => {
		editorElement.remove();

		return editor.destroy();
	} );

	it( 'should be only applied to newly enabled elements', () => {
		model.schema.register( 'htmlDiv', {} );
		dataFilter.allowElement( 'div' );

		editor.setData( '<div><p>foobar</p></div>' );

		expect( getModelData( model, { withoutSelection: true } ) ).to.equal(
			'<paragraph>foobar</paragraph>'
		);

		expect( editor.getData() ).to.equal( '<p>foobar</p>' );
	} );

	it( 'should recognize paragraph-like elements', () => {
		dataFilter.allowElement( 'div' );

		editor.setData( '<div><i>foo</i>bar<b>baz</b></div>' );

		expect( getModelData( model, { withoutSelection: true } ) ).to.equal(
			'<htmlDivParagraph>' +
			'<$text italic="true">foo</$text>bar<$text bold="true">baz</$text>' +
			'</htmlDivParagraph>'
		);

		expect( editor.getData() ).to.equal( '<div><i>foo</i>bar<strong>baz</strong></div>' );
	} );

	it( 'should recognize paragraph-like elements with soft breaks', () => {
		dataFilter.allowElement( 'div' );

		editor.setData( '<div>foo<br>bar</div>' );

		expect( getModelData( model, { withoutSelection: true } ) ).to.equal(
			'<htmlDivParagraph>foo<softBreak></softBreak>bar</htmlDivParagraph>'
		);

		expect( editor.getData() ).to.equal( '<div>foo<br>bar</div>' );
	} );

	it( 'should recognize block elements', () => {
		dataFilter.allowElement( 'div' );

		editor.setData( '<div><p>foobar</p></div>' );

		expect( getModelData( model, { withoutSelection: true } ) ).to.equal(
			'<htmlDiv><paragraph>foobar</paragraph></htmlDiv>'
		);

		expect( editor.getData() ).to.equal( '<div><p>foobar</p></div>' );
	} );

	it( 'should preserve allowed attributes', () => {
		// Sanity check to ensure that preserving attributes provided by block
		// elements handling still works.
		dataFilter.allowElement( 'div' );
		dataFilter.allowAttributes( { name: 'div', attributes: { 'data-foo': true } } );

		editor.setData( '<div data-foo><p>foobar</p></div>' );

		expect( getModelDataWithAttributes( model, { withoutSelection: true } ) ).to.deep.equal( {
			data: '<htmlDiv htmlAttributes="(1)"><paragraph>foobar</paragraph></htmlDiv>',
			attributes: {
				1: {
					attributes: { 'data-foo': '' }
				}
			}
		} );

		expect( editor.getData() ).to.equal( '<div data-foo=""><p>foobar</p></div>' );
	} );

	it( 'should remove disallowed attributes', () => {
		// Sanity check to ensure that disallowing attributes provided by block
		// elements handling still works.
		dataFilter.allowElement( 'div' );
		dataFilter.allowAttributes( { name: 'div', attributes: { 'data-foo': true } } );
		dataFilter.disallowAttributes( { name: 'div', attributes: { 'data-foo': true } } );

		editor.setData( '<div data-foo><p>foobar</p></div>' );

		expect( getModelDataWithAttributes( model, { withoutSelection: true } ) ).to.deep.equal( {
			data: '<htmlDiv><paragraph>foobar</paragraph></htmlDiv>',
			attributes: {}
		} );

		expect( editor.getData() ).to.equal( '<div><p>foobar</p></div>' );
	} );

	it( 'should ensure that model element is allowed in the insertion context', () => {
		dataSchema.registerBlockElement( {
			model: 'htmlXyz',
			view: 'xyz',
			asParagraph: 'htmlXyzParagraph',
			modelSchema: {
				allowChildren: 'p'
			}
		} );

		dataFilter.allowElement( 'xyz' );

		editor.setData( '<xyz><p>xyz</p></xyz>' );

		expect( editor.getData() ).to.equal( '' );
	} );
} );
